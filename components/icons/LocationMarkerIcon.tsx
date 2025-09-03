import React from 'react';
import { MapPin } from 'lucide-react';

const LocationMarkerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <MapPin {...props} />
);

export default LocationMarkerIcon;
