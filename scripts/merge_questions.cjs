const fs = require('fs');
const path = require('path');

const questionBankDir = path.join(__dirname, '../new question bank');
const outputFile = path.join(__dirname, '../src/quizquestions.json');

const mergedQuestions = {};

fs.readdir(questionBankDir, (err, files) => {
    if (err) {
        console.error('Could not list the directory.', err);
        process.exit(1);
    }

    files.forEach((file, index) => {
        if (file.endsWith('.json')) {
            const filePath = path.join(questionBankDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const json = JSON.parse(content);
                // Merge keys (Topic names) into the main object
                Object.assign(mergedQuestions, json);
                console.log(`Merged ${file}`);
            } catch (e) {
                console.error(`Error parsing ${file}:`, e);
            }
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(mergedQuestions, null, 2));
    console.log(`Successfully acquired all knowledge! Wrote to ${outputFile}`);
});
