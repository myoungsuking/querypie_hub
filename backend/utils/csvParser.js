// CSV 파싱 유틸리티
class CsvParser {
    static parseCSV(csvData) {
        // UTF-8 BOM 제거
        if (csvData.charCodeAt(0) === 0xFEFF) {
            csvData = csvData.slice(1);
        }
        
        // 개선된 CSV 파싱 (쌍따옴표 처리)
        const lines = this.parseCSVLines(csvData);
        if (lines.length < 2) return [];

        // 헤더 파싱
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const users = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= 3) {
                const user = {};
                headers.forEach((header, index) => {
                    if (values[index]) {
                        const value = values[index].trim();
                        switch (header) {
                            case 'email':
                                user.email = value;
                                break;
                            case 'loginid':
                            case 'login_id':
                                user.loginId = value;
                                break;
                            case 'name':
                                user.name = value;
                                break;
                        }
                    }
                });
                
                if (user.email && user.loginId && user.name) {
                    users.push(user);
                }
            }
        }

        return users;
    }

    // CSV 라인들을 파싱 (쌍따옴표 처리)
    static parseCSVLines(csvData) {
        const lines = [];
        let currentLine = '';
        let inQuotes = false;
        
        for (let i = 0; i < csvData.length; i++) {
            const char = csvData[i];
            const nextChar = csvData[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // 이스케이프된 따옴표
                    currentLine += '"';
                    i++; // 다음 따옴표 건너뛰기
                } else {
                    // 따옴표 시작/끝
                    inQuotes = !inQuotes;
                }
            } else if (char === '\n' && !inQuotes) {
                // 따옴표 밖에서 줄바꿈
                if (currentLine.trim()) {
                    lines.push(currentLine);
                }
                currentLine = '';
            } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
                // Windows 줄바꿈 (CRLF)
                if (currentLine.trim()) {
                    lines.push(currentLine);
                }
                currentLine = '';
                i++; // LF 건너뛰기
            } else if (char !== '\r') {
                // CR만 있는 경우 제외
                currentLine += char;
            }
        }
        if (currentLine.trim()) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // CSV 라인 파싱 (쌍따옴표 처리)
    static parseCSVLine(line) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // 이스케이프된 따옴표
                    currentValue += '"';
                    i++;
                } else {
                    // 따옴표 시작/끝
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 따옴표 밖에서 쉼표
                values.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue);
        
        return values;
    }
}

module.exports = CsvParser;
