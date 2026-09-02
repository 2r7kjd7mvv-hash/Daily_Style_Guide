// cloud callFunction name: 'login' mock
import type { UserInfo } from '@/types';

export default function mockLogin(): Promise<{ code: number; message: string; data: UserInfo }> {
  console.log('[Mock][login] called');
  return Promise.resolve({
    code: 0,
    message: 'ok',
    data: {
      openid: 'mock-openid-0001',
      nickName: '穿搭小达人',
      avatarUrl: 'https://picsum.photos/id/64/200/200',
      created_at: Date.now()
    }
  });
}
