// dto/workspace-detail-response.dto.ts

export class BoardSummaryDto {
  id: string;
  title: string;
  tasksCount: number;
  membersCount: number;
  updatedAt: Date;
}

export class WorkspaceDetailResponseDto {
  id: string;
  name: string;
  description: string;
  boards: BoardSummaryDto[];
}
