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
  id: string;
  pageId: string;
  creator: string;
  name: string;
  thumbnail: string; // Base64 encoded image
  ownershipType: number; // 0: Single, 1: MultiSig, 2: Permissionless (가정)
  updateFee: string;
  imt: boolean;
  currentHtml: string;
  totalLikes: string;
  totalDislikes: string;
  balance: string;
  multiSigOwners: string[] | null;
  multiSigThreshold: number | null;
}
