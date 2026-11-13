import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Respeita o "Reduzir movimento" do sistema: animações ficam paradas. */
export function useReduzirMovimento() {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (ativo) setReduzir(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir);
    return () => {
      ativo = false;
      sub.remove();
    };
  }, []);
  return reduzir;
}
