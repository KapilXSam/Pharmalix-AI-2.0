
import React from 'react';
import { ClipboardList } from 'lucide-react';

const PrescriptionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <ClipboardList {...props} />
);

export default PrescriptionIcon;