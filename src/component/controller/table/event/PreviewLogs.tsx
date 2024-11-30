type GrowtopiaColorCode = '`0' | '`1' | '`2' | '`3' | '`4' | '`5' | '`6' | '`7' | '`8' | '`9' | '`!' | '`@' | '`#' | '`$' | '`^' | '`&' | '`w' | '`o' | '`b' | '`p' | '`q' | '`e' | '`r' | '`t' | '`a' | '`s' | '`c' | '`ì';  // All valid color codes

class LogViewer {
  private growtopiaColors: Record<GrowtopiaColorCode, string> = {
    '`0': '#ffffff',
    '`1': '#adf4ff',
    '`2': '#49fc00',
    '`3': '#bfdaff',
    '`4': '#ff271d',
    '`5': '#ebb7ff',
    '`6': '#ffca6f',
    '`7': '#e6e6e6',
    '`8': '#ff9445',
    '`9': '#ffee7d',
    '`!': '#d1fff9',
    '`@': '#ffcdc9',
    '`#': '#ff8ff3',
    '`$': '#fffcc5',
    '`^': '#b5ff97',
    '`&': '#feebff',
    '`w': '#ffffff',
    '`o': '#fce6ba',
    '`b': '#000000',
    '`p': '#ffdff1',
    '`q': '#0c60a4',
    '`e': '#19b9ff',
    '`r': '#6fd357',
    '`t': '#2f830d',
    '`a': '#515151',
    '`s': '#9e9e9e',
    '`c': '#50ffff',
    '`ì': '#ffe119',
  };
  
  private regex = /(`[0-9!@#^&wobpqertascì$])([^`]*)/g;
  
  private parseDisplayName(displayName: string): string {
    const parsed = displayName.replace(this.regex, (match, colorCode: GrowtopiaColorCode, text) => {  // Explicitly define colorCode as GrowtopiaColorCode
      const color = this.growtopiaColors[colorCode];
      if (color) {
        return `<span style="color:${color}">${text}</span>`;
      } else {
        return text;
      }
    });
    
    const cleanedParsed = parsed.replace(/``/g, '').replace(/`/g, '').replace(/\$/g, ''); // Remove `$` and other unnecessary characters
    
    return cleanedParsed.endsWith('``') ? cleanedParsed.slice(0, -2) : cleanedParsed;
  }
  
  public showLogs(params: any): void {
    const logContent = params.node.data.console
      .map((log: string) => `<div style="font-size: 12px;">${this.parseDisplayName(log)}</div>`)
      .join('');
    
    const newWindow = window.open('', 'Logs', 'width=1200,height=600');
    if (newWindow) {
      newWindow.document.write(`
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Geist:wght@100..900&display=swap" rel="stylesheet">
        
        <html>
          <head>
            <title>Logs</title>
            <style>
              body {
                font-family: 'Fira Code', sans-serif;
                background-color: black;
                color: white;
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <h1 class="text-lg font-bold">Logs</h1>
            ${logContent}
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      console.error('Unable to open a new window for logs.');
    }
  }
}

export default LogViewer;