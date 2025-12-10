import React from 'react';
import { Baby, Star, Heart, CheckCircle2, AlertTriangle, Gift, Flag, Calendar, Zap } from 'lucide-react';
import { IconName } from '../types';

export const ICON_MAP: Record<IconName, React.FC<any>> = {
  baby: Baby,
  star: Star,
  heart: Heart,
  check: CheckCircle2,
  alert: AlertTriangle,
  gift: Gift,
  flag: Flag,
  calendar: Calendar,
  zap: Zap
};

export const renderIcon = (name: IconName | undefined, props: any) => {
  const IconComponent = name && ICON_MAP[name] ? ICON_MAP[name] : Star;
  return <IconComponent {...props} />;
};

export const AVAILABLE_ICONS: IconName[] = [
  'baby', 'star', 'heart', 'flag', 'alert', 'gift', 'calendar', 'zap', 'check'
];