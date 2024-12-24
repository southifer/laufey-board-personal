import axios from 'axios';
import { toast } from 'react-hot-toast';

class Command {
  private ip: string;
  private index: string;
  private script: string;

  constructor(ip: string, index: string, script: string) {
    this.ip = ip;
    this.index = index;
    this.script = script;
  }

  private async executeScriptRequest(script: string, action: string): Promise<void> {
    const successMessage = `Sending request to ${action} successful`;
    const errorMessage = `${action} failed`;

    try {
      await axios.post(`http://${this.ip}/bot/runScript`, script, {
        headers: { 'Content-Type': 'text/plain' },
      });
      toast.success(`(${this.index}) ${successMessage}`);
    } catch (error: any) {
      const errorDetails = error.response?.data || error.message || 'Unknown error';
      toast.error(`(${this.index}) ${errorMessage}: ${errorDetails}`);
    }
  }

  private generateLoopScript(botActions: string): string {
    return `
      for _, i in pairs(${this.index}) do
          local bot = getBot(i)
          ${botActions}
      end
    `;
  }

  public async startTutorial(): Promise<void> {
    const script = this.generateLoopScript(`
      local tutorial = bot.auto_tutorial
      tutorial.enabled = true
      tutorial.auto_quest = true
      tutorial.set_as_home = true
      tutorial.set_high_level = true
      tutorial.set_random_skin = true
      tutorial.set_random_profile = true
      tutorial.detect_tutorial = true
    `);
    await this.executeScriptRequest(script, 'start tutorial');
  }

  public async stopTutorial(): Promise<void> {
    const script = this.generateLoopScript(`bot.auto_tutorial.enabled = false`);
    await this.executeScriptRequest(script, 'Stopping tutorial');
  }

  public async startRotasi(): Promise<void> {
    const script = `
      local script = read("C:\\\\Users\\\\Administrator\\\\Desktop\\\\rotasi-luci-json.lua")
      ${this.generateLoopScript(`
          bot:runScript(script)
          sleep(1500)
      `)}
    `;
    await this.executeScriptRequest(script, 'start rotation');
  }

  public async removeBot(): Promise<void> {
    const script = this.generateLoopScript(`removeBot(bot.name)`);
    await this.executeScriptRequest(script, 'Removing bot');
  }

  public async reconnectBot(): Promise<void> {
    const script = this.generateLoopScript(`
        bot.auto_reconnect = true
        bot:disconnect()
        sleep(1000)
        bot:connect()
    `);
    await this.executeScriptRequest(script, 'reconnect bot');
  }

  public async disconnectBot(): Promise<void> {
    const script = this.generateLoopScript(`
        bot.auto_reconnect = false
        bot:disconnect()
    `);
    await this.executeScriptRequest(script, 'disconnect bot');
  }

  public async executeScript(): Promise<void> {
    await this.executeScriptRequest(this.script, 'execute script');
  }

  public async stopScript(): Promise<void> {
    const script = this.generateLoopScript(`bot:stopScript()`);
    await this.executeScriptRequest(script, 'stopping script');
  }

  public async startLeveling(): Promise<void> {
    const script = `
        local script = read("rotasi-mass-2.lua")
        ${this.generateLoopScript(`
          bot:runScript(script)
          sleep(1500)
        `)}
    `;
    await this.executeScriptRequest(script, 'start leveling');
  }
}

export default Command;