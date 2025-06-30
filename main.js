// Base64 кодировка / декодировка (ASCII-safe)
const base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

//TODO: Переводим массив байтов в base64 строку
function bytesToBase64(bytes) {
    let result = '';
    let i = 0;

    while (i < bytes.length) {
    const byte1 = bytes[i++];
    const byte2 = i < bytes.length ? bytes[i++] : 0;
    const byte3 = i < bytes.length ? bytes[i++] : 0;

    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    const char1 = base64chars[(triplet >> 18) & 0x3F];
    const char2 = base64chars[(triplet >> 12) & 0x3F];
    const char3 = i - 1 < bytes.length ? base64chars[(triplet >> 6) & 0x3F] : '=';
    const char4 = i < bytes.length ? base64chars[triplet & 0x3F] : '=';

    result += char1 + char2 + char3 + char4;
    }

    return result;
}

//TODO: Переводим base64 строку обратно в массив байтов
function base64ToBytes(str) {
    str = str.replace(/[^A-Za-z0-9+/=]/g, '');
    
    const bytes = [];
    let i = 0;

    while (i < str.length) {
    const c1 = base64chars.indexOf(str[i++]);
    const c2 = base64chars.indexOf(str[i++]);
    const c3 = base64chars.indexOf(str[i++]);
    const c4 = base64chars.indexOf(str[i++]);

    const triplet = (c1 << 18) | (c2 << 12) | ((c3 & 0x3F) << 6) | (c4 & 0x3F);

    const byte1 = (triplet >> 16) & 0xFF;
    const byte2 = (triplet >> 8) & 0xFF;
    const byte3 = triplet & 0xFF;

    bytes.push(byte1);
    if (str[i - 2] !== '=') bytes.push(byte2);
    if (str[i - 1] !== '=') bytes.push(byte3);
    }

    return bytes;
}

//TODO: Превращаем массив чисел в base64 строку
function serialize(numbers) {
    if (!Array.isArray(numbers)) {
    throw new Error('Ожидался массив чисел');
    }

    const isValid = numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 300);
    if (!isValid) {
    throw new Error('Числа должны быть целыми от 1 до 300');
    }

    const bits = [];

    for (let num of numbers) {
    for (let i = 8; i >= 0; i--) {
        const bit = (num >> i) & 1;
        bits.push(bit);
    }
    }

    const paddingBits = (8 - (bits.length % 8)) % 8;
    for (let i = 0; i < paddingBits; i++) {
    bits.push(0);
    }

    const bytes = [];

    for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
        byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
    }

    return bytesToBase64(bytes);
}

//TODO: Превращаем base64 строку обратно в массив чисел
function deserialize(str) {
    const bytes = base64ToBytes(str);

    const bits = [];

    for (let byte of bytes) {
    for (let i = 7; i >= 0; i--) {
        const bit = (byte >> i) & 1;
        bits.push(bit);
    }
    }

    const numbers = [];

    for (let i = 0; i + 9 <= bits.length; i += 9) {
    let num = 0;
    for (let j = 0; j < 9; j++) {
        num = (num << 1) | bits[i + j];
    }
    if (num === 0) break;
    numbers.push(num);
    }

    return numbers;
}

//TODO: тестирование
function testCompress(numbers, label = 'Тест') {
    const originalStr = numbers.join(',');
    const compressed = serialize(numbers);
    const decompressed = deserialize(compressed);

    const ratio = (compressed.length / originalStr.length).toFixed(3);
    const pass = JSON.stringify(numbers) === JSON.stringify(decompressed);

    console.log(
    `${label.padEnd(25)} | Чисел: ${String(numbers.length).padStart(4)} | ` +
    `Исходная: ${String(originalStr.length).padStart(5)} | ` +
    `Сжатая: ${String(compressed.length).padStart(5)} | ` +
    `Коэф: ${ratio.padStart(5)} | ${pass ? '✅' : '❌'}`
    );

    //Для красоты
    return `
        <tr>
            <td>${label}</td>
            <td>${numbers.length}</td>
            <td>${originalStr.length}</td>
            <td>${compressed.length}</td>
            <td>${ratio}</td>  
            <td class="${pass ? 'ok' : 'fail'}">${pass ? '✅' : '❌'}</td>            
        </tr>
    `;
}

console.log('=== Тесты сериализации ===');
// Простейшие
testCompress([1, 2, 3, 4, 5], 'Простейшие');
// 50 случайных чисел от 1 до 300
testCompress(Array.from({ length: 50 }, () => Math.floor(Math.random() * 300) + 1), 'Случайные 50');
// 100 случайных
testCompress(Array.from({ length: 100 }, () => Math.floor(Math.random() * 300) + 1), 'Случайные 100');
// 500 случайных
testCompress(Array.from({ length: 500 }, () => Math.floor(Math.random() * 300) + 1), 'Случайные 500');
// 1000 случайных
testCompress(Array.from({ length: 1000 }, () => Math.floor(Math.random() * 300) + 1), 'Случайные 1000');
// Все однозначные 1..9 по 10 раз (90 чисел)
testCompress(Array(10).fill().flatMap(() => [1,2,3,4,5,6,7,8,9]), 'Однозначные (1–9) x10');
// Все двузначные 10..99 по одному разу (90 чисел)
testCompress(Array.from({ length: 90 }, (_, i) => i + 10), 'Двузначные (10–99)');
// Все трёхзначные 100..300 по одному разу (201 число)
testCompress(Array.from({ length: 201 }, (_, i) => i + 100), 'Трёхзначные (100–300)');
// Каждого числа 1..300 по 3 раза (900 чисел)
testCompress(Array(3).fill().flatMap(() => Array.from({ length: 300 }, (_, i) => i + 1)), 'Каждое от 1 до 300 ×3');


//TODO: Для красоты
function runTests() {
    const cases = [
        { label: 'Простейшие', numbers: [1, 2, 3, 4, 5] },
        { label: 'Случайные 50', numbers: Array.from({ length: 50 }, () => Math.floor(Math.random() * 300) + 1) },
        { label: 'Случайные 100', numbers: Array.from({ length: 100 }, () => Math.floor(Math.random() * 300) + 1) },
        { label: 'Случайные 500', numbers: Array.from({ length: 500 }, () => Math.floor(Math.random() * 300) + 1) },
        { label: 'Случайные 1000', numbers: Array.from({ length: 1000 }, () => Math.floor(Math.random() * 300) + 1) },
        { label: 'Однозначные (1–9) x10', numbers: Array(10).fill().flatMap(() => [1,2,3,4,5,6,7,8,9]) },
        { label: 'Двузначные (10–99)', numbers: Array.from({ length: 90 }, (_, i) => i + 10) },
        { label: 'Трёхзначные (100–300)', numbers: Array.from({ length: 201 }, (_, i) => i + 100) },
        { label: 'Каждое от 1 до 300 ×3', numbers: Array(3).fill().flatMap(() => Array.from({ length: 300 }, (_, i) => i + 1)) },
    ];

    let html = `
        <table>
            <tr>
                <th>Тест</th>
                <th>Чисел</th>
                <th>Длина строки</th>
                <th>Сжатая длина</th>
                <th>Коэф. сжатия</th>
                <th>OK?</th>
            </tr>
    `;

    for (const test of cases) {
        html += testCompress(test.numbers, test.label);
    }

    html += '</table>';
    document.getElementById('results').innerHTML = html;
}

runTests();