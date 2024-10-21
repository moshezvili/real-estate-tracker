import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: 'fromDate and toDate are required' }, { status: 400 });
  }

  // Function to fetch data for a specific date range
  async function fetchDataForRange(start: string, end: string) {
    const url = `https://alerts-history.oref.org.il//Shared/Ajax/GetAlarmsHistory.aspx?lang=he&fromDate=${start}&toDate=${end}&mode=0`;

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

    return await response.json();
  }

  try {

    // Convert dates to Date objects for easier comparison
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    // Calculate the difference in days
    const diffTime = Math.abs(toDateObj.getTime() - fromDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If the date range is more than 30 days, split it into chunks
    if (diffDays > 30) {
      let currentDate = new Date(fromDateObj);
      const endDate = new Date(toDateObj);
      let allData: any[] = [];

      while (currentDate <= endDate) {
        let chunkEndDate = new Date(currentDate);
        chunkEndDate.setDate(chunkEndDate.getDate() + 29);

        if (chunkEndDate > endDate) {
          chunkEndDate = endDate;
        }

        const chunkStart = currentDate.toISOString().split('T')[0];
        const chunkEnd = chunkEndDate.toISOString().split('T')[0];

        const chunkData = await fetchDataForRange(chunkStart, chunkEnd);
        allData = allData.concat(chunkData);

        currentDate.setDate(currentDate.getDate() + 30);
      }

      return NextResponse.json(allData);
    }

    // If 30 days or less, fetch data normally
    const data = await fetchDataForRange(fromDate, toDate);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
