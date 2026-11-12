// Audio effects completely disabled by user request
class SoundFX {
  constructor() {
    this.enabled = false;
  }
  init() {}
  playEngineRev() {}
  playRadarPing() {}
  playCameraClick() {}
  playLegendaryFanfare() {}
}

export const sound = new SoundFX();
