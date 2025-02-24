'use client';
import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
}

export default function TypingText({ text, speed = 50 }: TypingTextProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    let currentText = '';
    let tagBuffer = ''; // HTML 태그를 임시 저장할 버퍼
    let isTag = false; // 현재 문자가 HTML 태그 내부인지 여부

    const timer = setInterval(() => {
      if (i >= text.length) {
        clearInterval(timer);
        return;
      }

      const char = text[i];
      i++;

      if (char === '<') {
        isTag = true; // HTML 태그 시작
        tagBuffer += char;
      } else if (char === '>') {
        isTag = false; // HTML 태그 끝
        tagBuffer += char;
        currentText += tagBuffer; // 태그는 한 번에 추가
        tagBuffer = ''; // 버퍼 초기화
      } else if (isTag) {
        tagBuffer += char; // 태그 내부에 있는 문자라면 버퍼에 저장
      } else {
        currentText += char; // 일반 텍스트는 한 글자씩 추가
      }

      setDisplayText(currentText);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div
      className='whitespace-pre-wrap font-mono text-white'
      dangerouslySetInnerHTML={{ __html: displayText }}
    />
  );
}
