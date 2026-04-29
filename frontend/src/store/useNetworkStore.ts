import { create } from 'zustand';

interface NetworkState {
  isWakingUpServer: boolean;
  setIsWakingUpServer: (val: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isWakingUpServer: false,
  setIsWakingUpServer: (val) => set({ isWakingUpServer: val }),
}));
