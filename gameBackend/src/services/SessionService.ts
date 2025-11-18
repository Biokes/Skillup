import { Socket, Server } from "socket.io";
import { CreateGameDTO } from "@/src/data/entities/DTO/CreateGame";
import { JoinRoomDTO } from "@/src/data/entities/DTO/joinRoom";
import {
  QuickMatchDTO,
  quickMatchSchema,
} from "../data/entities/DTO/QuickMatch";
import { SessionRepository } from "../data/db/sessionRepository";
import { Session } from "../data/entities/models/Session";
import { ChainSkillsException } from "../exceptions";
import { ZodError } from "zod";
import { GameService } from "./GameService";

export default class SessionService {
  private readonly sessionRepository: SessionRepository;
    private readonly socketServer: Server;
    private readonly gameService: GameService;  
  constructor(server: Server) {
    this.sessionRepository = new SessionRepository();
    this.socketServer = server;
    this.gameService = new GameService()  
  }

  async createGameRoom(createDTO: CreateGameDTO) {}

  async joinRoom(joinRoomDTO: JoinRoomDTO) {}

  async findQuickMatch(quickMatchDTO: QuickMatchDTO): Promise<Session> {
    try {
      const existing = await this.sessionRepository.findOne({
        where: { player1: quickMatchDTO.walletAddress, status: "WAITING" },
      });
      if (existing) return existing;
      const foundSessions: Session[] = await this.sessionRepository.find({
        where: { status: "WAITING", isStaked: quickMatchDTO.isStaked },
      });
      const availableSession = foundSessions.find(
        (entity) => entity.player1 !== quickMatchDTO.walletAddress
      );
      if (availableSession) {
        return (await this.sessionRepository.update(availableSession.id, {
          player2: quickMatchDTO.walletAddress,
          status: "READY",
        })) as Session;
      }
      return await this.sessionRepository.create({
        player1: quickMatchDTO.walletAddress,
        amount: quickMatchDTO.amount,
        isStaked: quickMatchDTO.isStaked,
        status: "WAITING",
      });
    } catch (error) {
      throw new ChainSkillsException(
        `Error finding quickMatch: ${
          (error as Error).message
        }, at SessionService.ts:findQuickMatch`
      );
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
          this.gameService.createGameForSession(session)
          this.socketServer.to(`game-${session.id}`).emit("joined", {
              id: session.id,
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
      const existing = await this.sessionRepository.findOne({
        where: { player1: quickMatchDTO.walletAddress, status: "WAITING" },
      });
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
      const existing = await this.sessionRepository.findOne({ where: { player1: walletAddress, status: "WAITING" },});
      if (existing) await this.sessionRepository.delete(existing.id);
      socket.emit("cancelQuickMatch", {successful: true});
    } catch (error) {
      socket.emit("cancelMatchError", { successful: false, message: (error as Error).message});
      return;
    }
  }

  //   async cancelQuickMatch(walletAddress: string): Promise<void> {
  //     try {
  //         await this.sessionRepository.delete({
  //             where:{
  //             player1: walletAddress,
  //             status: "WAITING"
  //         }});
  //     } catch (error) {
  //         throw new ChainSkillsException(
  //             `Error cancelling quickMatch: ${error.message}, at SessionService.ts:cancelQuickMatch`
  //         );
  //     }
  // }

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
