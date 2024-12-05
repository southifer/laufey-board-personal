import axios from 'axios';

class Interface {
  private ip: string;
  private index: number;
  private item: number;
  
  constructor(ip: string, index: number, item: number) {
    this.ip = ip;
    this.index = index;
    this.item = item;
  }
  
  private async executeItemAction(script: string, action: string): Promise<void> {
    try {
      const response = await axios.post(
        `http://${this.ip}/bot/runScript`,
        script,
        {
          headers: {
            'Content-Type': 'text/plain',
          },
        }
      );
      console.log(`${action} response:`, response.data);
    } catch (error) {
      console.error(`Error ${action} item (${this.item}):`, error);
    }
  }
  
  private generateScript(action: 'wear' | 'trash' | 'drop'): string {
    const itemAction =
      action === 'wear'
        ? `bot:${action}(${this.item})`
        : `bot:${action}(${this.item}, bot:getInventory():findItem(${this.item}))`;
    
    return `
      bot = getBot(${this.index})
      if bot:isInWorld() and bot:getInventory():findItem(${this.item}) > 0 then
          ${itemAction}
          sleep(500)
      end
    `;
  }
  
  public async trash(): Promise<void> {
    const script = this.generateScript('trash');
    await this.executeItemAction(script, 'trashing');
  }
  
  public async wear(): Promise<void> {
    const script = this.generateScript('wear');
    await this.executeItemAction(script, 'wearing');
  }
  
  public async drop(): Promise<void> {
    const script = this.generateScript('drop');
    await this.executeItemAction(script, 'dropping');
  }
}

export default Interface;