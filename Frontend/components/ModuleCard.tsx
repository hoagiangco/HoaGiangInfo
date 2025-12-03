'use client';

import Link from 'next/link';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  route: string;
}

interface ModuleCardProps {
  module: Module;
  token: string;
}

export default function ModuleCard({ module, token }: ModuleCardProps) {
  return (
    <Link href={`/${token}${module.route}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="text-4xl mb-4">{module.icon || '📋'}</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {module.displayName}
        </h3>
        {module.description && (
          <p className="text-gray-600 text-sm">{module.description}</p>
        )}
      </div>
    </Link>
  );
}







