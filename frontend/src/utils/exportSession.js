export function exportSessionToMarkdown(messages, storeState) {
  const { currentSurface, coordinates, epoch } = storeState;
  
  // Count verified tool invocations
  const verifiedSteps = messages.filter(msg => msg.toolUsed).length;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dateString = new Date().toLocaleString();

  // 1. Live Session Statistics (Front-matter)
  let markdown = `---
Session Topic: Multi-Variable Gradient Descent
Total Steps Verified: ${verifiedSteps}
Final Coordinates: X: ${coordinates.x.toFixed(4)}, Y: ${coordinates.y.toFixed(4)}, Z: ${coordinates.z.toFixed(4)}
Exported On: ${dateString}
---\n\n`;

  // 2. Iterate through messages
  messages.forEach((msg) => {
    if (msg.role === 'user') {
      markdown += `## 🧑💻 Student\n\n${msg.content}\n\n`;
    } else if (msg.role === 'tutor') {
      markdown += `## 🤖 subgrad Engine\n\n${msg.content}\n\n`;
    }
  });

  // 3. Blob approach
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  // Implicit <a> tag download
  const a = document.createElement('a');
  a.href = url;
  a.download = `subgrad_session_${timestamp}.md`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
