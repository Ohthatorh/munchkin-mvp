// import { filePath } from "@/utils/functions/filePath";
import clsx from "clsx";
import Image, { ImageProps, StaticImageData } from "next/image";
import { FC } from "react";

interface IAppPicture extends ImageProps {
  src: string | StaticImageData;
  alt: string;
  width?: number;
  height?: number;
  tablet?: string;
  mobile?: string;
  className?: string;
  pictureClassName?: string;
  fancybox?: string;
}

const AppPicture: FC<IAppPicture> = ({
  src,
  className,
  tablet,
  mobile,
  alt,
  width,
  height,
  pictureClassName,
  fancybox,
  ...props
}) => {
  const classNames = clsx("object-contain", className);
  const sourceImage = typeof src === "string" ? /* filePath(src)*/ src : src;
  return (
    <picture className={pictureClassName}>
      {mobile && (
        <source
          media="(max-width: 767.98px)"
          srcSet={/* filePath(mobile) */ mobile}
        />
      )}
      {tablet && (
        <source
          media="(max-width: 1365.98px)"
          srcSet={/* filePath(tablet) */ tablet}
        />
      )}
      <Image
        src={sourceImage}
        alt={alt}
        width={width}
        height={height}
        className={classNames}
        {...(fancybox && { "data-fancybox": fancybox })}
        {...props}
      />
    </picture>
  );
};

export default AppPicture;
