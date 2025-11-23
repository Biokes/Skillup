import { Socket, Server } from "socket.io";
// import { CreateGameDTO } from "@/src/data/DTO/CreateGame";
import { JoinRoomDTO } from "@/src/data/DTO/joinRoom";
import { QuickMatchDTO, quickMatchSchema } from "../data/DTO/QuickMatch";
import { SessionRepository } from "../data/repositories/sessionRepository";
import { Session } from "../data/models/Session";
import { ChainSkillsException } from "../exceptions";
import { success, ZodError } from "zod";
import { GameService } from "./GameService";
import { Game } from "../data/models/Game";
import { SESSION_STATUS } from "../utils";

export default class SessionService {
  private readonly sessionRepository: SessionRepository;
  private readonly socketServer: Server;
  private readonly gameService: GameService;
  
  constructor(server: Server) {
    this.sessionRepository = new SessionRepository();
    this.socketServer = server;
    this.gameService = new GameService(server)  
  }

    // async createGameRoom(createDTO: CreateGameDTO) {}

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
      const game: Game = await this.gameService.createGameForSession(sessionFound);
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
      const existing = await this.sessionRepository.findOne({  where: { player1: quickMatchDTO.walletAddress, status: SESSION_STATUS.WAITING, isStaked: quickMatchDTO.isStaked, amount: quickMatchDTO.amount}, });
      if (existing) return existing;
      const foundSessions: Session[] = await this.sessionRepository.find({  where: { status: SESSION_STATUS.WAITING, isStaked: quickMatchDTO.isStaked, amount: quickMatchDTO.amount } });
      const availableSession = foundSessions.find((entity) => entity.player1 !== quickMatchDTO.walletAddress);
      if (availableSession) {
        return (await this.sessionRepository.update(availableSession.id, {  player2: quickMatchDTO.walletAddress,  status: SESSION_STATUS.READY , isStaked: quickMatchDTO.isStaked, amount: quickMatchDTO.amount,})) as Session;
      }
      return await this.sessionRepository.create({player1: quickMatchDTO.walletAddress,amount: quickMatchDTO.amount,isStaked: quickMatchDTO.isStaked,status: SESSION_STATUS.WAITING});
    } catch (error) {
      throw new ChainSkillsException( `Error finding quickMatch: ${(error as Error).message}, at SessionService.ts:findQuickMatch`);
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
          const game: Game = await this.gameService.createGameForSession(session)
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
      const existing = await this.sessionRepository.findOne({  where: { player1: quickMatchDTO.walletAddress, status: SESSION_STATUS.WAITING },});
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
      const existing = await this.sessionRepository.findOne({ where: { player1: walletAddress, status: SESSION_STATUS.WAITING },});
      if (existing) await this.sessionRepository.delete(existing.id);
      socket.emit("cancelQuickMatch", {successful: true, walletAddress});
    } catch (error) {
      socket.emit("cancelMatchError", { successful: false, walletAddress,message: (error as Error).message});
      return;
    }
  }

  async cancelCreateMatchWithCode(walletAddress: string, socket: Socket, code: string) {
     try {
      const existing = await this.sessionRepository.findOne({ where: { player1: walletAddress, status: SESSION_STATUS.WAITING, roomCode: code.toLowerCase()},});
      if (existing) await this.sessionRepository.delete(existing.id);
      socket.emit("cancelMatchWithCode", {successful: true, walletAddress});
    } catch (error) {
      socket.emit("cancelMatchWithCodeError", { successful: false, walletAddress,message: (error as Error).message});
      return;
    }
  }

  async getSessionById(id: string): Promise<Session|null> { 
      return await this.sessionRepository.findById(id)
  }
  
  async validateSession(sessionId: string, callback: any){
    const session = await this.getSessionById(sessionId);
    if (session) { 
      callback({ success: true })
      return;
    }
    callback({success:false})
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

  //       async handleCreateRoom(socket, data) {
  //     const { gameType, player, roomCode } = data;
  //     try {
  //       const room = this.roomService.createRoom(gameType, player, socket.id, roomCode);
  //       socket.join(room.code);
  //       socket.emit('roomCreated', { roomCode: room.code, room });
  //       console.log(`Room created: ${room.code} (${gameType})`);
  //     } catch (error) {
  //       socket.emit('error', { message: error.message });
  //     }
  //   }

  //   async handleJoinRoom(socket, data) {
  //     const { roomCode, player } = data;

  //     try {
  //       const result = this.roomService.joinRoom(roomCode, player, socket.id);

  //       if (!result.success) {
  //         socket.emit('error', { message: result.error });
  //         return;
  //       }

  //       socket.join(roomCode);

  //       const gameRecord = await this.gameRepo.findByRoomCode(roomCode);

  //       if (gameRecord?.isStaked && !gameRecord.player2TxHash) {
  //         socket.emit('stakedMatchJoined', {
  //           roomCode,
  //           stakeAmount: gameRecord.stakeAmount,
  //           player1Address: gameRecord.player1Address
  //         });
  //         return;
  //       }
  //       this.io.to(roomCode).emit('roomReady', { room: result.room });
  //       this.startGame(roomCode, result.room.gameType);
  //     } catch (error) {
  //       socket.emit('error', { message: error.message });
  //     }
  //   }
}
