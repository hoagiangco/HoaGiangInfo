'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ModuleCard from '@/components/ModuleCard';
import { useLanguage } from '@/components/LanguageProvider';
import { getTranslation } from '@/lib/i18n';
import Loading from '@/components/Loading';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  route: string;
}

export default function TokenHome() {
  const params = useParams();
  const token = params.token as string;
  const { language } = useLanguage();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/qr/verify/${token}`);
        if (!response.ok) throw new Error('Invalid QR code');
        const qrInfo = await response.json();

        const modulesResponse = await fetch('/api/modules');
        const allModules = await modulesResponse.json();
        const allowedModules = allModules.filter((m: Module) =>
          qrInfo.modules.includes(m.name)
        );
        setModules(allowedModules);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {getTranslation(language, 'welcome')}
        </h1>
        <p className="text-gray-600">
          {getTranslation(language, 'select_service')}
        </p>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">
            {getTranslation(language, 'no_modules')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}

