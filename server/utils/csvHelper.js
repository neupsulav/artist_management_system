const parseCSV = (data) => {
  const lines = data.split("\n").filter((line) => line.trim() !== "");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i];
    });
    return obj;
  });
};

const generateCSV = (headers, data) => {
  const csvRows = [];
  csvRows.push(headers.join(","));
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header] === null ? "" : row[header];
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
};

module.exports = { parseCSV, generateCSV };
