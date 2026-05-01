export async function exportToExcel(data, sheetName, filename) {
  if (!data.length) return;

  const { default: writeXlsxFile } = await import('write-excel-file/browser');

  const schema = Object.keys(data[0]).map((key) => ({
    column: key,
    type: String,
    value: (row) => String(row[key] ?? ''),
  }));

  await writeXlsxFile(data, {
    schema,
    fileName: filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
    sheet: sheetName,
  });
}
