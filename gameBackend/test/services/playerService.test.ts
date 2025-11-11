import { ChainSkillsException } from "@/src/exceptions/index";
import { DataBaseSource } from "@/src/config/dbSource";
import PlayerService from "@/src/services/playersService";
import Player from "@/src/"
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

  it("tests tests player profile creations", () => {
    test("Invalid Address creations failures", async () => {
      expect(await playerService.findOrCreateProfile("")).toThrow(ChainSkillsException);
      expect(await playerService.findOrCreateProfile("0x123456789012345678")).toThrow(ChainSkillsException);
      expect(await playerService.findOrCreateProfile("0x12345678901234567890")).toThrow(ChainSkillsException);
    });
    test("valid address profile creations", async () => {
      const player:Player = await playerService.createPlayerWithAddress("0x1234567890123456789012345678901234567890");
      expect(player.).toBe(1);
        
    });
  });
});
