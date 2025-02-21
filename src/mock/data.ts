export interface HTMLFile {
  id: string;
  name: string;
  page: string;
  htmlContent: string;
}

export const allHTMLFiles: HTMLFile[] = [];

// ✅ 유니크한 HTML 페이지 100개 생성
for (let i = 1; i <= 100; i++) {
  const page = Math.ceil(i / 10); // 10개씩 페이지 그룹
  const bgColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // 랜덤 배경색
  const textColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // 랜덤 텍스트 색상
  const buttonColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  const fontFamily = i % 2 === 0 ? 'Arial, sans-serif' : 'Courier, monospace'; // 폰트 다르게

  allHTMLFiles.push({
    id: `${i}`,
    name: `Dynamic Page ${i}`,
    page: `${page}`,
    htmlContent: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Dynamic Page ${i}</title>
      <style>
        body {
          background-color: ${bgColor};
          color: ${textColor};
          font-family: ${fontFamily};
          text-align: center;
          padding: 2rem;
        }
        h1 {
          font-size: ${16 + (i % 5) * 4}px;
        }
        .box {
          border: 2px solid ${textColor};
          padding: 1rem;
          margin-top: 1rem;
          background: rgba(255,255,255,0.2);
        }
        .btn {
          background: ${buttonColor};
          padding: 10px 20px;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }
        .btn:hover {
          background: black;
        }
      </style>
    </head>
    <body>
      <h1>Welcome to Page ${i}</h1>
      <div class="box">
        <p>This is dynamically generated page number ${i}.</p>
        <button class="btn" onclick="pageAction${i}()">Click me</button>
      </div>
      <script>
        function pageAction${i}() {
          alert("You clicked on Page ${i}!");
          console.log("User interacted with Page ${i}");
        }
      </script>
    </body>
    </html>
    `,
  });
}
