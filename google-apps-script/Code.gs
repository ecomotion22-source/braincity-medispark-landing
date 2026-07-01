const SHEET_NAME = '상담문의';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const sheet = getOrCreateSheet_();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '등록시각',
        '이름',
        '연락처',
        '관심평형',
        '상담희망',
        '문의내용',
        '유입경로',
        '전화연결여부',
        '원격주소',
      ]);
    }

    sheet.appendRow([
      body.createdAt || new Date().toISOString(),
      body.name || '',
      body.phone || '',
      body.interestType || '',
      body.consultingType || '',
      body.message || '',
      body.leadSource || '랜딩페이지',
      body.triggerCall ? 'Y' : 'N',
      body.remoteAddress || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: false,
          error: error.message || 'unknown_error',
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}
