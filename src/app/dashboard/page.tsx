'use client';
import Header from '@/components/layout/Header';
import { Planet } from './_components/Planet';
import { Canvas } from '@react-three/fiber';
import React, { useState } from 'react';

const allHtmlFiles = [
  {
    rank: 1,
    name: 'Worm Game',
    id: '0x123abc',
    date: '2024-02-25',
    like: 120,
    unlike: 3,
    html: `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"/><title>worm game</title><style>html,body{margin:0;padding:0;text-align:center;background:#f0f0f0;height:100%}#game{background:#000;display:block;margin:20px auto;border:2px solid #555;display:block}#gameover-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;font-family:sans-serif;font-size:24px;display:none}#overlay-content{background:#222;padding:20px 40px;border-radius:8px;text-align:center}#overlay-content button{margin-top:20px;padding:10px 20px;font-size:18px;cursor:pointer;border:none;border-radius:4px;background:#ff5555;color:#fff}</style></head><body><canvas id="game" width="400" height="400"></canvas><div id="gameover-overlay"><div id="overlay-content"><div id="gameover-text">Game Over!</div><div id="score-text">Score: <span id="final-score">0</span></div><button id="retry-btn">Retry</button></div></div><script>const canvas=document.getElementById("game");const ctx=canvas.getContext("2d");const gridSize=20;const tileCount=canvas.width/gridSize;const gameOverOverlay=document.getElementById("gameover-overlay");const finalScoreSpan=document.getElementById("final-score");const retryButton=document.getElementById("retry-btn");let snake,vx,vy,food,score,gameOver;function initGame(){snake=[{x:10,y:10}];vx=1;vy=0;score=0;food={x:15,y:15};gameOver=false;gameOverOverlay.style.display="none"}document.addEventListener("keydown",(e)=>{if(gameOver)return;switch(e.keyCode){case 37:if(vx!==1){vx=-1;vy=0}break;case 38:if(vy!==1){vx=0;vy=-1}break;case 39:if(vx!==-1){vx=1;vy=0}break;case 40:if(vy!==-1){vx=0;vy=1}break}});function gameLoop(){if(gameOver)return;const head={x:snake[0].x+vx,y:snake[0].y+vy};if(head.x<0||head.x>=tileCount||head.y<0||head.y>=tileCount){showGameOver();return}snake.unshift(head);for(let i=1;i<snake.length;i++){if(snake[i].x===head.x&&snake[i].y===head.y){showGameOver();return}}if(head.x===food.x&&head.y===food.y){score++;food.x=Math.floor(Math.random()*tileCount);food.y=Math.floor(Math.random()*tileCount)}else{snake.pop()}ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="lime";snake.forEach(part=>{ctx.fillRect(part.x*gridSize,part.y*gridSize,gridSize,gridSize)});ctx.fillStyle="red";ctx.fillRect(food.x*gridSize,food.y*gridSize,gridSize,gridSize)}function showGameOver(){gameOver=true;finalScoreSpan.textContent=score;gameOverOverlay.style.display="flex"}retryButton.addEventListener("click",()=>{initGame()});initGame();setInterval(gameLoop,100);</script></body></html>`,
  },
  {
    rank: 2,
    name: 'Worm Game',
    id: '0x123abc3',
    date: '2024-02-25',
    like: 120,
    unlike: 3,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Space Adventure</title><style>body{margin:0;padding:0;background:#000;color:#fff;font-family:sans-serif;text-align:center;user-select:none}h1{margin-top:20px}#gameCanvas{background:#111;border:2px solid #fff;display:block;margin:10px auto 0 auto}#scoreBoard{margin:0 auto;text-align:center;margin-top:10px;margin-bottom:10px}#scoreBoard span{margin:0 20px}</style></head><body><h1>Space Adventure</h1><div id="scoreBoard"><span>Score: <span id="score">0</span></span><span>Health: <span id="health">5</span></span></div><canvas id="gameCanvas" width="600" height="400"></canvas><script>const canvas=document.getElementById("gameCanvas");const ctx=canvas.getContext("2d");const scoreSpan=document.getElementById("score");const healthSpan=document.getElementById("health");const WIDTH=canvas.width;const HEIGHT=canvas.height;let player={x:WIDTH/2,y:HEIGHT-60,size:20,speed:4};let score=0;let health=5;let gameOver=false;let stars=[];let asteroids=[];let keys={};function initObjects(){for(let i=0;i<10;i++){stars.push({x:Math.random()*(WIDTH-20)+10,y:Math.random()*(HEIGHT-100)+50,size:5});}for(let i=0;i<5;i++){asteroids.push({x:Math.random()*(WIDTH-30)+15,y:Math.random()*(HEIGHT/2),size:15,speed:1+Math.random()*2});}}document.addEventListener("keydown",(e)=>{keys[e.key]=true;});document.addEventListener("keyup",(e)=>{keys[e.key]=false;});function update(){if(gameOver)return;if(keys["ArrowLeft"]){player.x-=player.speed;}if(keys["ArrowRight"]){player.x+=player.speed;}if(keys["ArrowUp"]){player.y-=player.speed;}if(keys["ArrowDown"]){player.y+=player.speed;}if(player.x<0){player.x=0;}if(player.x>WIDTH-player.size){player.x=WIDTH-player.size;}if(player.y<0){player.y=0;}if(player.y>HEIGHT-player.size){player.y=HEIGHT-player.size;}for(let i=0;i<stars.length;i++){if(checkCollision(player.x,player.y,player.size,stars[i].x,stars[i].y,stars[i].size)){score++;scoreSpan.textContent=score;stars[i].x=Math.random()*(WIDTH-20)+10;stars[i].y=Math.random()*(HEIGHT-100)+50;}}for(let i=0;i<asteroids.length;i++){asteroids[i].y+=asteroids[i].speed;if(checkCollision(player.x,player.y,player.size,asteroids[i].x,asteroids[i].y,asteroids[i].size)){health--;healthSpan.textContent=health;asteroids[i].x=Math.random()*(WIDTH-30)+15;asteroids[i].y=-20;}if(asteroids[i].y>HEIGHT+20){asteroids[i].x=Math.random()*(WIDTH-30)+15;asteroids[i].y=-20;}}if(health<=0){gameOver=true;}}function checkCollision(x1,y1,size1,x2,y2,size2){let distX=x1-x2;let distY=y1-y2;let distance=Math.sqrt(distX*distX+distY*distY);return distance<(size1/2+size2/2);}function draw(){ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.fillStyle="lime";ctx.beginPath();ctx.arc(player.x,player.y,player.size/2,0,Math.PI*2);ctx.fill();ctx.fillStyle="yellow";stars.forEach(star=>{ctx.beginPath();ctx.arc(star.x,star.y,star.size/2,0,Math.PI*2);ctx.fill();});ctx.fillStyle="grey";asteroids.forEach(ast=>{ctx.beginPath();ctx.arc(ast.x,ast.y,ast.size/2,0,Math.PI*2);ctx.fill();});if(gameOver){ctx.fillStyle="red";ctx.font="40px Arial";let gameOverText="GAME OVER";let gameOverMetrics=ctx.measureText(gameOverText);ctx.fillText(gameOverText,(WIDTH-gameOverMetrics.width)/2,HEIGHT/2);ctx.font="20px Arial";ctx.fillStyle="white";let restartText="Refresh (F5) to restart!";let restartMetrics=ctx.measureText(restartText);ctx.fillText(restartText,(WIDTH-restartMetrics.width)/2,(HEIGHT/2)+40);}}function gameLoop(){update();draw();requestAnimationFrame(gameLoop);}initObjects();gameLoop();</script></body></html>    `,
  },
];

const Mypage = () => {
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const selectedFile = selectedFileId
    ? generatePlanetAttributes(selectedFileId)
    : null;

  function generatePlanetAttributes(id: string) {
    const hashCode = (str: string) => {
      return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    };
    const numericId = hashCode(id);
    return {
      color: `#${((numericId * 9973) % 0xffffff).toString(16).padStart(6, '0')}`,
      planetSize: (numericId % 6) + 3,
      rotationSpeed: (numericId % 5) * 0.3 + 0.5,
    };
  }

  return (
    <div>
      <Header />
      <main className='flex h-[calc(100vh-100px)] flex-col items-center justify-center'>
        <div className='relative flex h-[1000px] w-[1200px] flex-col items-center justify-center border-2 border-pink-500 p-4 text-pink-500'>
          {/* 좌측 막대 그래프 */}
          <div className='absolute left-4 top-16 w-[150]'>
            <StatBar label='STARS' color='bg-pink-500' value={20} max={100} />
            <StatBar label='PROOFS' color='bg-blue-400' value={50} max={100} />
            <StatBar label='CYCLES' color='bg-blue-400' value={30} max={100} />
            <div className='mt-10 h-full w-full'>
              <Canvas>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} />
                {selectedFile && (
                  <Planet
                    key={selectedFileId}
                    rotationSpeed={selectedFile.rotationSpeed}
                    planetSize={2.5}
                    geometries={5}
                    color={selectedFile.color}
                  />
                )}
              </Canvas>
            </div>
            <div>#ID: 0x003818913</div>
          </div>

          {/* 우측 정보 */}
          <div className='absolute right-4 top-16 text-sm'>
            <div>3302.3 MHz</div>
            <div>PREVIEW: 20.985</div>
            <div>
              BALANCE REMAINING: <span className='text-white'>0.00 USDC</span>
            </div>
          </div>
          <div className='mb-10 flex h-[600px] w-[600px] max-w-4xl items-center justify-center overflow-hidden border border-pink-500 bg-white'>
            {selectedHtml ? (
              <iframe className='h-full w-full' srcDoc={selectedHtml} />
            ) : (
              <span className='text-pink-500'>Click on a file to preview</span>
            )}
          </div>
          <div className='mt-6 flex w-full max-w-6xl space-x-6'>
            {/* ✅ 왼쪽 - 내가 배포한 HTML 리스트 */}
            <div className='flex-1 border border-pink-500 p-4'>
              <h2 className='mb-3 text-lg font-bold text-pink-500'>
                📂 My Deployments
              </h2>

              {/* 🔹 테이블 */}
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='border-b border-pink-500 text-pink-300'>
                    <th className='p-2 text-left'>Rank</th>
                    <th className='p-2 text-left'>Name</th>
                    <th className='p-2 text-left'>ID</th>
                    <th className='p-2 text-left'>Date</th>
                    <th className='p-2 text-left'>👍</th>
                    <th className='p-2 text-left'>👎</th>
                  </tr>
                </thead>
                <tbody>
                  {allHtmlFiles.map((file) => (
                    <tr
                      key={file.id}
                      className='cursor-pointer border-b border-gray-700 hover:bg-gray-800'
                      onClick={() => {
                        setSelectedHtml(file.html);
                        setSelectedFileId(file.id);
                      }}
                    >
                      <td className='p-2'>{file.rank}</td>
                      <td className='p-2 text-cyan-300'>{file.name}</td>
                      <td className='p-2'>{file.id}</td>
                      <td className='p-2'>{file.date}</td>
                      <td className='p-2 text-green-400'>{file.like}</td>
                      <td className='p-2 text-red-400'>{file.unlike}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ 오른쪽 - 요청 리스트 */}
            <div className='w-[300px] border border-pink-500 p-4'>
              <h2 className='mb-3 text-lg font-bold text-pink-500'>
                📬 Requests
              </h2>
              <ul className='space-y-2'>
                <li className='flex justify-between text-cyan-300'>
                  <span>@crypto_fan</span>
                  <span className='text-sm text-gray-400'>2 hours ago</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Mypage;

function StatBar({
  label,
  color,
  value,
  max,
}: {
  label: string;
  color: string;
  value: number;
  max: number;
}) {
  return (
    <div className='mb-2'>
      <div className='mb-1 text-xs'>{label}:</div>
      <div className='relative h-4 w-40 border border-pink-500'>
        <div
          className={`${color} h-full`}
          style={{ width: `${(value / max) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
