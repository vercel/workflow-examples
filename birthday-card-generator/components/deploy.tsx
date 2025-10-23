import Image from 'next/image';

export const DeployButton = () => {
  const url = new URL('https://vercel.com/new/clone');

  // Demo
  url.searchParams.set(
    'demo-description',
    'A free, open-source template for building natural language image search on the AI Cloud.'
  );
  url.searchParams.set('demo-image', 'tbd');
  url.searchParams.set('demo-title', 'Birthday Card Generator');
  url.searchParams.set('demo-url', 'birthday-card-generator.vercel.sh');

  // Marketplace
  url.searchParams.set('from', 'templates');
  url.searchParams.set('project-name', 'Birthday Card Generator');

  // Repository
  url.searchParams.set('repository-name', 'birthday-card-generator');
  url.searchParams.set(
    'repository-url',
    'https://github.com/vercel/workflow/tree/main/examples/birthday-card-generator'
  );

  return (
    <a href={url.toString()}>
      <Image
        alt="Deploy with Vercel"
        height={32}
        src="https://vercel.com/button"
        unoptimized
        width={103}
      />
    </a>
  );
};
