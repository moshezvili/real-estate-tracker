import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  console.log(`Received request with fromDate: ${fromDate}, toDate: ${toDate}`);

  if (!fromDate || !toDate) {
    console.log('Missing fromDate or toDate');
    return NextResponse.json({ error: 'fromDate and toDate are required' }, { status: 400 });
  }

  function parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('.');
    return new Date(parseInt(year), parseInt(month)-1, parseInt(day));
  }

  function formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Function to fetch data for a specific date range
  async function fetchDataForRange(start: string, end: string) {
    const url = `https://alerts-history.oref.org.il//Shared/Ajax/GetAlarmsHistory.aspx?lang=he&fromDate=${start}&toDate=${end}&mode=0`;
    console.log(`Fetching data for range: ${start} to ${end}`);

    const response = await fetch(url, {
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,he;q=0.8",
        "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://alerts-history.oref.org.il/12481-en/Pakar.aspx?pagemode=iframe&u1st=0",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} alerts for range ${start} to ${end}`);
    return data;
  }

  try {
    const fromDateObj = parseDate(fromDate);
    const toDateObj = parseDate(toDate);

    console.log(`Parsed dates: from ${formatDate(fromDateObj)} to ${formatDate(toDateObj)}`);

    const diffTime = Math.abs(toDateObj.getTime() - fromDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(`Date range: ${diffDays} days`);

    let allData: any[] = [];
    let currentDate = new Date(fromDateObj);
    const endDate = new Date(toDateObj);

    while (currentDate <= endDate) {
      let chunkEndDate = new Date(currentDate);
      chunkEndDate.setDate(chunkEndDate.getDate() + 29);

      if (chunkEndDate > endDate) {
        chunkEndDate = endDate;
      }

      const chunkStart = formatDate(currentDate);
      const chunkEnd = formatDate(chunkEndDate);

      console.log(`Processing chunk: ${chunkStart} to ${chunkEnd}`);
      const chunkData = await fetchDataForRange(chunkStart, chunkEnd);
      allData = allData.concat(chunkData);
      console.log(`Total alerts collected: ${allData.length}`);

      currentDate.setDate(currentDate.getDate() + 30);
    }

    console.log(`Returning ${allData.length} total alerts`);
    return NextResponse.json(allData);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
