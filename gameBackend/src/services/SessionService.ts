import { DefaultEventsMap, Socket } from "socket.io";
import { CreateGameDTO } from "@/src/data/entities/DTO/CreateGame";
import { JoinRoomDTO } from "@/src/data/entities/DTO/joinRoom";
import { QuickMatchDTO } from "@/src/data/entities/DTO/QuickMatch";
import {SessionRepostory} from "@/src/data/db/SessionRepository"
export default class SessionService {
    private readonly sessionRepository: SesssionRepository;
    constructor() { 
        this.sessionRepository = new SessionRepository();
    }
    async createGameRoom(createDTO: CreateGameDTO) { }
    async joinRoom(joinRoomDTO: JoinRoomDTO) { }
    async findQuickMatch(quickMatchDTO: QuickMatchDTO) {

    }
    async deActivateOlderSessions(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) { }
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