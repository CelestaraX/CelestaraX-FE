export interface HTMLFile {
  id: string; // 고유 ID
  name: string; // 파일명
  htmlContent: string; // HTML 내용
}

export interface OrbitingHtmlPlanetProps {
  file: HTMLFile; // 어떤 파일(행성)에 대응되는지
  orbitRadius: number; // 공전 반지름
  orbitSpeed: number; // 공전 속도
  rotationSpeed: number; // 자전 속도
  planetSize: number; // 행성 크기
  initialAngle?: number; // 시작 각도
  onPlanetSelect?: (file: HTMLFile) => void; // 클릭 시 호출
}

export interface PageCreated {
  id: string; // 페이지 생성 트랜잭션 ID
  pageId: string; // 서비스 내에서의 페이지 ID
  creator: string; // 페이지 생성자 (지갑 주소)
  ownershipType: number; // 0 = Single, 1 = MultiSig, 2 = Permissionless
  updateFee: string; // 업데이트 수수료 (Wei 단위)
  imt: boolean; // 페이지가 불변인지 여부
  blockNumber: string; // 블록 번호
  blockTimestamp: string; // 페이지 생성 타임스탬프
}
