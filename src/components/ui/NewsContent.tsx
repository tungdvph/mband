interface NewsContentProps {
  content: string;
}

export default function NewsContent({ content }: NewsContentProps) {
  return (
    <div 
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  );
}