import type { ReactNode } from 'react';
import { Drawer } from 'vaul';

interface BottomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  children: ReactNode;
  title?: string;
  description?: string;
}


export const BottomDrawer = ({ 
  open, 
  onOpenChange, 
  trigger, 
  children, 
  title, 
  description 
}: BottomDrawerProps) => {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-navy-deep/60 z-50 backdrop-blur-md" />
        <Drawer.Content className="bg-navy-deep flex flex-col rounded-t-[4rem] h-[92%] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 shadow-[0_-32px_64px_-12px_rgba(0,0,0,0.5)]">
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mx-auto w-16 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-10" />
            <div className="max-w-md mx-auto space-y-8">
              <div className="space-y-2 text-center">
                {title && <Drawer.Title className="text-4xl font-black text-white tracking-tighter">{title}</Drawer.Title>}
                {description && <Drawer.Description className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{description}</Drawer.Description>}
              </div>
              {children}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
