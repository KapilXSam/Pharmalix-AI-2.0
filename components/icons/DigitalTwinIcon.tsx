import React from 'react';
// FIX: Replaced non-existent 'Body' icon with 'PersonStanding' from lucide-react.
import { PersonStanding } from 'lucide-react';

const DigitalTwinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <PersonStanding {...props} />
);

export default DigitalTwinIcon;