import { ChainSkillsException } from "../exceptions"

export default class PlayerService {
    private readonly playerRepository: PlayerRepository;
    
    async findOrCreateProfile(walletAddress: string) {
        if (walletAddress.length < 22 || walletAddress.length > 42)
            throw new ChainSkillsException("Invalid address");
        let playerFound = this.playerRepository.findOne({where:}) 
        console.log(walletAddress)
    }
 }