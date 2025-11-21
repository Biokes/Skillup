import PlayerRepository from "../data/repositories/playerRepository";
import { ChainSkillsException } from "../exceptions"

export default class PlayerService {
    private readonly playerRepository: PlayerRepository;
    constructor() { 
        this.playerRepository = new PlayerRepository();
    }
    async findOrCreateProfile(walletAddress: string) {
        if (walletAddress.length < 22 || walletAddress.length > 42)
            throw new ChainSkillsException("Invalid address");
        let playerFound = await this.playerRepository.findOne({ where: {walletAddress: walletAddress.toLowerCase()}}) 
        if (playerFound) return playerFound
        return await this.playerRepository.create({walletAddress:walletAddress.toLowerCase()})
    }
    async findByWalletAddress(walletAddress:string) {
        return await this.playerRepository.findOne({where:{ walletAddress: walletAddress.toLowerCase() }});
    }
    async findByName(name: string) {
        return this.playerRepository.find({ where: {username:name.toLowerCase()} })
    }
 }