interface MemberCardProps {
  name: string;
  role: string;
  image: string;
  description: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

const MemberCard = ({ name, role, image, description, socialLinks }: MemberCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img src={image} alt={name} className="w-full h-64 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-red-600">{role}</p>
        <p className="mt-2 text-gray-600">{description}</p>
        <div className="mt-4 flex space-x-4">
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} className="text-gray-600 hover:text-red-600">
              Facebook
            </a>
          )}
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} className="text-gray-600 hover:text-red-600">
              Instagram
            </a>
          )}
          {socialLinks.twitter && (
            <a href={socialLinks.twitter} className="text-gray-600 hover:text-red-600">
              Twitter
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberCard;