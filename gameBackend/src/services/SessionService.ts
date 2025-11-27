import { Socket, Server } from "socket.io";
import { JoinRoomDTO } from "@/src/data/DTO/joinRoom";
import { QuickMatchDTO, quickMatchSchema } from "../data/DTO/QuickMatch";
import { SessionRepository } from "../data/repositories/sessionRepository";
import { Session } from "../data/models/Session";
import { ChainSkillsException } from "../exceptions";
import { ZodError } from "zod";
import { GameService } from "./GameService";
import { Game } from "../data/models/Game";
import { SESSION_STATUS } from "../utils";
import { IsNull, Not } from "typeorm";
import { TransactionRepository } from "../data/repositories/transaction";
import { Transaction } from "../data/models/Transaction";

export default class SessionService {
  private readonly sessionRepository: SessionRepository;
  private readonly socketServer: Server;
  private readonly gameService: GameService;
  private readonly transactionRepo: TransactionRepository;
  constructor(server: Server) {
    this.sessionRepository = new SessionRepository();
    this.socketServer = server;
    this.gameService = new GameService(server);
    this.transactionRepo = new TransactionRepository();
  }

  async joinRoom(joinRoomDTO: JoinRoomDTO, socket: Socket) {
    const wallet = joinRoomDTO.walletAddress.toLowerCase();
    const code = joinRoomDTO.gameCode.toLowerCase();

    const existingSession = await this.sessionRepository.findOne({
      where: {
        player1: wallet,
        status: SESSION_STATUS.WAITING,
        isStaked: false,
        amount: 0,
        roomCode: code
      }
    });

    if (existingSession) {
      this.joinAndEmitSession(socket, existingSession);
      return;
    }

    const foundSessions: Session[] = await this.sessionRepository.find({
      where: {
        status: SESSION_STATUS.WAITING,
        isStaked: false,
        amount: 0,
        roomCode: code
      }
    });

    let sessionFound = foundSessions.find(
      (session) =>
        !!session.player1 &&
        session.player1.toLowerCase() !== wallet
    );
    
    if (sessionFound) {
      const updatedSession = await this.sessionRepository.update(sessionFound.id, {
        player2: wallet,
        status: SESSION_STATUS.READY
      });
      if (!updatedSession) {
        socket.emit("joinError", {
          successful: false,
          message: "Failed to update session."
        });
        return;
      }
      sessionFound = updatedSession;
      const game: Game = await this.gameService.createGameForSession(sessionFound,false);
      socket.join(`game-${sessionFound.id}`);
      this.socketServer.to(`game-${sessionFound.id}`).emit("joinedWithCode", {
        sessionId: sessionFound.id,
        status: sessionFound.status,
        code: sessionFound.roomCode,
        isStaked: sessionFound.isStaked,
        player1: sessionFound.player1,
        player2: sessionFound.player2,
        amount: sessionFound.amount,
        gameId: game.id
      });
      return;
    }

    const newSession = await this.sessionRepository.create({
      player1: wallet,
      roomCode: code,
      isStaked: false,
      amount: 0,
      status: SESSION_STATUS.WAITING
    });

    this.joinAndEmitSession(socket, newSession);
  }
 
  async findQuickMatch(quickMatchDTO: QuickMatchDTO): Promise<Session> {
    try {
      const existing = await this.sessionRepository.findOne({
        where: {
          player1: quickMatchDTO.walletAddress,
          status: SESSION_STATUS.WAITING,
          isStaked: quickMatchDTO.isStaked,
          amount: quickMatchDTO.amount,
          roomCode: IsNull()
        },
      });
      if (existing) return existing;
      const foundSessions: Session[] = await this.sessionRepository.find({ where: { status: SESSION_STATUS.WAITING, isStaked: quickMatchDTO.isStaked, amount: quickMatchDTO.amount } });
      const availableSession = foundSessions.find((entity) => entity.player1 !== quickMatchDTO.walletAddress);
      if (availableSession) {
        return (await this.sessionRepository.update(availableSession.id, {
          player2: quickMatchDTO.walletAddress,
          status: SESSION_STATUS.READY, isStaked: quickMatchDTO.isStaked,
          amount: quickMatchDTO.amount,
        })) as Session;
      }
      return await this.sessionRepository.create({
        player1: quickMatchDTO.walletAddress,
        amount: quickMatchDTO.amount,
        isStaked: quickMatchDTO.isStaked,
        status: SESSION_STATUS.WAITING
      });
    } catch (error) {
      throw new ChainSkillsException(`Error finding quickMatch: ${(error as Error).message}, at SessionService.ts:findQuickMatch`);
    }
  }

  async handleQuickMatch(quickMatchDTO: QuickMatchDTO, socket: Socket) {
    let validatedDto;
    try {
      validatedDto = quickMatchSchema.parse(quickMatchDTO);
    } catch (error) {
      socket.emit("quickMatchError", error instanceof ZodError
        ? { successful: false, message: "Invalid data " }
        : { successful: false, error }
      );
      return;
    }
    const session: Session = await this.findQuickMatch(validatedDto!);
    socket.join(`game-${session.id}`);
    if (session.player2) {
      const game: Game = await this.gameService.createGameForSession(session, false)
      this.socketServer.to(`game-${session.id}`).emit("joined", {
        sessionId: session.id,
        status: session.status,
        isStaked: session.isStaked,
        player1: session.player1,
        player2: session.player2,
        amount: session.amount,
        gameId: game.id
      })
      return;
    }
    socket.emit("waiting", {
      status: session.status,
      isStaked: session.isStaked,
      player1: session.player1,
      amount: session.amount,
    });
  }

  async handleRetryQuickMatch(quickMatchDTO: QuickMatchDTO, socket: Socket) {
    try {
      const existing = await this.sessionRepository.findOne({ where: { player1: quickMatchDTO.walletAddress, status: SESSION_STATUS.WAITING }, });
      if (existing) {
        await this.sessionRepository.delete(existing.id);
      }
      await this.handleQuickMatch(quickMatchDTO, socket);
    } catch (error) {
      socket.emit("retryMatchError",
        error instanceof ZodError
          ? { successful: false, message: error.message }
          : { successful: false, error }
      );
      return;
    }
  }

  async cancelQuickMatch(walletAddress: string, socket: Socket): Promise<void> {
    try {
      const existing = await this.sessionRepository.findOne({ where: { player1: walletAddress, status: SESSION_STATUS.WAITING }, });
      if (existing) await this.sessionRepository.delete(existing.id);
      socket.emit("cancelQuickMatch", { successful: true, walletAddress });
    } catch (error) {
      socket.emit("cancelMatchError", { successful: false, walletAddress, message: (error as Error).message });
      return;
    }
  }

  async cancelCreateMatchWithCode(walletAddress: string, socket: Socket, code: string) {
    try {
      const existing = await this.sessionRepository.findOne({ where: { player1: walletAddress, status: SESSION_STATUS.WAITING, roomCode: code.toLowerCase() }, });
      if (existing) await this.sessionRepository.delete(existing.id);
      socket.emit("cancelMatchWithCode", { successful: true, walletAddress });
    } catch (error) {
      socket.emit("cancelMatchWithCodeError", { successful: false, walletAddress, message: (error as Error).message });
      return;
    }
  }

  async getSessionById(id: string): Promise<Session | null> {
    return await this.sessionRepository.findById(id)
  }
  
  async validateSession(sessionId: string, callback: any) {
    const session = await this.getSessionById(sessionId);
    if (session) {
      callback({ success: true })
      return;
    }
    callback({ success: false })
  }

  async checkStakedMatch(dto: { price: number, walletAddress: string }, callback: any) {
    try {
      const sessions = await this.sessionRepository.find({
        where: {
          status: SESSION_STATUS.WAITING,
          amount: dto.price,
          isStaked: true,
          roomCode: IsNull()
        }
      })
      let sessionFound = sessions.find((session) => !!session.player1 && session.player1.toLowerCase() !== dto.walletAddress);
      if (sessionFound) {
        callback({ success: true, gameId: sessionFound.gameObjectId })
        return;
      }
      callback({ success: false, gameId: '' })
    } catch (error: unknown) {
      console.error("error: ", error);
      callback({ success: false, gameId: '' })
    }
  }

  async createStakedMatch(dto: { gameId: string, paymentTransactionId: string, address: string, stakingPrice: number }, socket: Socket) {
    try {
      const sessionCreated = await this.sessionRepository.create({
        player1: dto.address.toLowerCase(),
        amount: dto.stakingPrice,
        isStaked: true,
        status: SESSION_STATUS.WAITING,
        gameObjectId: dto.gameId.toLowerCase()
      });
      const transactionCreated = await this.transactionRepo.create({
        owner: dto.address.toLowerCase(),
        transactionDigest: dto.paymentTransactionId.toLowerCase(),
        gameObjectId: dto.gameId.toLowerCase(),
        amount: dto.stakingPrice,
        isValid: true
      })
      this.joinAndEmitPaidGameConnection(socket, sessionCreated, transactionCreated);
    }
    catch (error: unknown) {
      socket.emit("createStakedMatchError", { successful: false, walletAddress: dto.address, message: (error as Error).message });
      return;
    }
  }

  async pauseStakeGameConection(dto: {sessionId:string,address:string,stakingPrice: number}, socket: Socket) { 
    try {
      const sessionFound = await this.getSessionById(dto.sessionId);
      if (
        sessionFound && sessionFound.status == SESSION_STATUS.WAITING &&
        sessionFound.amount == dto.stakingPrice && sessionFound.player1?.toLowerCase() == dto.address.toLowerCase() && !sessionFound.player2
      ) {
        await this.sessionRepository.update(dto.sessionId, { status: SESSION_STATUS.PAUSED })
        socket.leave(`paid-game-${sessionFound.id}`)
        return;
      }
      socket.emit("pauseStakedMatchError", { successful: false, walletAddress: dto.address, message: 'session not found'});
     }
    catch (error) {
      socket.emit("pauseStakedMatchError", { successful: false, walletAddress: dto.address, message: (error as Error).message });
    }
  }

  async cancelStakedGame(dto: { sessionId: string, address: string, stakingPrice: number }, socket: Socket) {
    try{
      const sessionFound = await this.getSessionById(dto.sessionId);
      if (
        sessionFound && (sessionFound.status == SESSION_STATUS.WAITING || sessionFound.status == SESSION_STATUS.PAUSED )&&
        sessionFound.amount == dto.stakingPrice && sessionFound.player1?.toLowerCase() == dto.address.toLowerCase() && !sessionFound.player2
      ) {
        await this.sessionRepository.update(dto.sessionId, { status: SESSION_STATUS.ENDED })
        socket.leave(`paid-game-${sessionFound.id}`)
        // refund player
        // contract execution to refund
        return;
      }
      socket.emit("cancelStakedMatchError", { successful: false, walletAddress: dto.address, message: 'session not found' });
    }catch (error) { 
      socket.emit("cancelStakedMatchError", { successful: false, walletAddress: dto.address, message: (error as Error).message });
    }
  }

  async onStakedGameConnection(dto: { sessionId: string, address: string, stakingPrice: number, transactionId:string }, socket: Socket) {
     try {
      const sessionFound = await this.getSessionById(dto.sessionId);
      if (
        sessionFound && sessionFound.status == SESSION_STATUS.PAUSED &&
        sessionFound.amount == dto.stakingPrice && sessionFound.player1?.toLowerCase() == dto.address.toLowerCase() 
      ) {
        await this.sessionRepository.update(dto.sessionId, { status: SESSION_STATUS.WAITING })
        const transaction = await this.transactionRepo.findById(dto.transactionId);
        if(!transaction) throw new ChainSkillsException("invalid transaction id")
        this.joinAndEmitPaidGameConnection(socket,sessionFound,transaction)
        return;
      }
      socket.emit("pauseStakedMatchError", { successful: false, walletAddress: dto.address, message: 'session not found'});
     }
    catch (error) {
      socket.emit("pauseStakedMatchError", { successful: false, walletAddress: dto.address, message: (error as Error).message });
    }
  }

  async joinStakedMatch(dto: { gameId:string, paymentTransactionId:string, address: string, stakingPrice: number }, socket: Socket) {
    try { 
      const sessionsFound = await this.sessionRepository.findOne({ where:{
          status: SESSION_STATUS.WAITING,
          isStaked: true,
          amount: dto.stakingPrice,
          gameObjectId: dto.gameId.toLowerCase(),
          player1: Not(dto.address.toLowerCase()),
        }
      })
      if (sessionsFound) { 
        await this.sessionRepository.update(sessionsFound.id, {
          player2: dto.address.toLowerCase(),
          status: SESSION_STATUS.READY
        })
        await this.transactionRepo.create({
            owner: dto.address.toLowerCase(),
            transactionDigest: dto.paymentTransactionId.toLowerCase(),
            gameObjectId: dto.gameId.toLowerCase(),
            amount: dto.stakingPrice,
            isValid: true
        })
        const game: Game = await this.gameService.createGameForSession(sessionsFound, true);
        socket.join(`paid-game-${sessionsFound.id}`)
        this.socketServer.to(`paid-game-${sessionsFound.id}`).emit('joinedPaidConnection', {
          sessionId: sessionsFound.id,
          status: sessionsFound.status,
          isStaked: sessionsFound.isStaked,
          player1: sessionsFound.player1,
          player2: sessionsFound.player2,     
          amount: sessionsFound.amount,
          game: game.id
        });
      }
    }
    catch (error) { 
      
    }
  }
  
  private joinAndEmitSession(socket: Socket, sessionFound: Session) {
    socket.join(`game-${sessionFound.id}`);
    socket.emit("waitingWithCode", {
      sessionId: sessionFound.id,
      status: sessionFound.status,
      code: sessionFound.roomCode,
      isStaked: sessionFound.isStaked,
      player1: sessionFound.player1,
      amount: sessionFound.amount
    });
  }

  private joinAndEmitPaidGameConnection(socket: Socket, sessionCreated: Session, transactionCreated: Transaction) {
    socket.join(`paid-game-${sessionCreated.id}`);
    socket.emit('waitingForPaidConnection', {
      sessionId: sessionCreated.id,
      status: sessionCreated.status,
      isStaked: sessionCreated.isStaked,
      player1: sessionCreated.player1,
      amount: sessionCreated.amount,
      transaction: transactionCreated.id
    });
  }


}
