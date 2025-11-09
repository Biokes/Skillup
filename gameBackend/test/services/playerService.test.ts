import { DataBaseSource } from "@/src/config/dbSource";
import PlayerService from "@/src/services/playersService"

describe("player service test", () => {
    let playerService: PlayerService;  
  beforeAll(async () => {
      await DataBaseSource.initialize();
      playerService = new PlayerService();
  });

  afterAll(async () => {
    await DataBaseSource.dropDatabase();
    await DataBaseSource.destroy();
  });
    
    it("tests players can be create profiles", () => { 
        
    })
});
