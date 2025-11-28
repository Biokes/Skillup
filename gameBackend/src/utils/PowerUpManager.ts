import { PlayerGameState, GAME_CONSTANTS } from ".";

export class PowerupManager {
  static validatePowerup(playerState: PlayerGameState, powerupType: string): boolean {
    // Check if powerup is on cooldown
    const cooldownRemaining = playerState.powerupCooldowns[powerupType] || 0;
    if (cooldownRemaining > 0) return false;

    // Check if powerup is already active
    if (playerState.activePowerup === powerupType) return false;

    // TODO: Check blockchain NFT inventory when contract ready
    return true;
  }
  
  static applyPowerup(playerState: PlayerGameState, powerupType: string): void {
    playerState.activePowerup = powerupType;
    playerState.powerupDuration = GAME_CONSTANTS.POWERUP_DURATION_FRAMES;
    playerState.powerupCooldowns[powerupType] = GAME_CONSTANTS.POWERUP_COOLDOWN_MS;

    if (powerupType === 'padStretch') {
      // Handled in game loop - paddle height increase
    } else if (powerupType === 'shield') {
      playerState.shieldActive = true;
    }
    // multiball is visual only
  }

  static updatePowerups(playerState: PlayerGameState, deltaTimeMs: number): void {
    // Update cooldowns
    Object.keys(playerState.powerupCooldowns).forEach((key) => {
      const cooldown = playerState.powerupCooldowns[key];
      if (cooldown !== undefined) {
        playerState.powerupCooldowns[key] = Math.max(cooldown - deltaTimeMs, 0);
      }
    });

    // Update active powerup duration
    if (playerState.activePowerup && playerState.powerupDuration > 0) {
      playerState.powerupDuration--;
    } else if (playerState.activePowerup && playerState.powerupDuration <= 0) {
      // Powerup expired
      if (playerState.activePowerup === 'shield') {
        playerState.shieldActive = false;
      }
      playerState.activePowerup = null;
    }
  }

  static getPaddleHeight(playerState: PlayerGameState): number {
    if (playerState.activePowerup === 'padStretch') {
      return GAME_CONSTANTS.PADDLE_HEIGHT_STRETCHED;
    }
    return GAME_CONSTANTS.PADDLE_HEIGHT;
  }
}