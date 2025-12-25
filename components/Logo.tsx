import logo from "../context/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

const sizeMap = {
  sm: "h-30",
  md: "h-20",
  lg: "h-14",
};

const Logo: React.FC<LogoProps> = ({ size = "md", withText = false }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <img
        src={logo}
        alt="IELTS Writing"
        className={`${sizeMap[size]} w-auto object-contain`}
        draggable={false}
      />

  
    </div>
  );
};

export default Logo;
