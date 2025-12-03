const fs = require('fs');
const path = require('path');

// Use absolute path directly to avoid CWD issues
const filePath = 'c:\\Users\\arunc\\OneDrive\\Documents\\Desktop\\f124\\RGH\\rozgaar-hub\\src\\lib\\i18n.ts';
console.log(`Current Working Directory: ${process.cwd()}`);
console.log(`Target File Path: ${filePath}`);

try {
    if (!fs.existsSync(filePath)) {
        console.error(`File does not exist: ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    console.log(`Total lines: ${lines.length}`);

    // Ranges to remove (1-based inclusive)
    const ranges = [
        [1964, 2002],
        [1803, 1841],
        [1642, 1680],
        [1481, 1519],
        [1320, 1358]
    ];

    // Remove from bottom to top
    ranges.sort((a, b) => b[0] - a[0]);

    const newLines = [...lines];

    for (const [start, end] of ranges) {
        const startIndex = start - 1;
        const count = end - start + 1;

        console.log(`Removing lines ${start} to ${end} (Count: ${count})`);
        // Check bounds
        if (startIndex < 0 || startIndex >= newLines.length) {
            console.error(`Invalid start index: ${startIndex}`);
            continue;
        }

        console.log(`First line to remove: ${newLines[startIndex].trim().substring(0, 50)}...`);

        newLines.splice(startIndex, count);
    }

    console.log(`New total lines: ${newLines.length}`);

    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(filePath, newLines.join(lineEnding));
    console.log('Successfully updated i18n.ts');

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
