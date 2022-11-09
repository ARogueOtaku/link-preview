let abortController = null;
let previousTag = null;
let isFetching = false;

const ogAPIURL = `https://ogextractor.netlify.app/.netlify/functions/ogExtractionHandler?url=`;
const placeHolderImageURL = `https://raw.githubusercontent.com/ARogueOtaku/link-preview/master/assets/placeholder.png`;

//Popup Container Creation and Styles
const popupContainer = document.createElement("div");
popupContainer.style.position = "fixed";
popupContainer.style.backgroundColor = "#ffffff";
popupContainer.style.paddingRight = "5px";
popupContainer.style.display = "flex";
popupContainer.style.fontFamily = "Trebuchet MS,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Tahoma,sans-serif";
popupContainer.style.top = "0px";
popupContainer.style.left = "0px";
popupContainer.style.width = "580px";
popupContainer.style.height = "180px";
popupContainer.style.borderRadius = "10px";
popupContainer.style.zIndex = "9999";
popupContainer.style.overflow = "hidden";
popupContainer.style.display = "none";
document.body.appendChild(popupContainer);
const showPopupContainer = () => {
  popupContainer.style.display = "flex";
};
const hidePopupContainer = () => {
  popupContainer.style.display = "none";
};

//Image Creation and Styles
const imageContainer = document.createElement("div");
imageContainer.style.width = "180px";
imageContainer.style.height = "180px";
const image = document.createElement("img");
image.style.width = "180px";
image.style.height = "180px";
image.style.objectFit = "fill";
imageContainer.appendChild(image);
popupContainer.appendChild(imageContainer);
const loadNewImage = (src = placeHolderImageURL) => {
  image.style.visibility = "hidden";
  const tempImg = new Image();
  tempImg.addEventListener("load", () => {
    console.log(src);
    image.src = tempImg.src;
    image.style.visibility = "inherit";
  });
  tempImg.src = src;
};

//Content Creation and Styles
const contentContainer = document.createElement("div");
contentContainer.style.marginTop = "15px";
contentContainer.style.marginRight = "10px";
contentContainer.style.marginLeft = "15px";
contentContainer.style.marginBottom = "15px";
contentContainer.style.lineHeight = "18.5px";
contentContainer.style.gap = "10px";
contentContainer.style.width = "400px";
contentContainer.style.display = "flex";
contentContainer.style.overflow = "hidden";
contentContainer.style.flexDirection = "column";
contentContainer.style.color = "#797e7d";
popupContainer.appendChild(contentContainer);

const type = document.createElement("span");
type.style.fontSize = "14px";
type.style.textDecoration = "underline dotted";
type.style.textTransform = "capitalize";
contentContainer.appendChild(type);

const title = document.createElement("span");
title.style.display = "-webkit-box";
title.style.webkitBoxOrient = "vertical";
title.style.webkitLineClamp = "1";
title.style.lineHeight = "28.5px";
title.style.overflow = "hidden";
title.style.fontSize = "22px";
title.style.fontWeight = "bold";
title.style.color = "#232323";
contentContainer.appendChild(title);

const description = document.createElement("span");
description.style.display = "-webkit-box";
description.style.webkitBoxOrient = "vertical";
description.style.webkitLineClamp = "2";
description.style.overflow = "hidden";
description.style.fontSize = "14px";
contentContainer.appendChild(description);

const divider = document.createElement("div");
divider.style.margin = "0px";
divider.style.width = "90%";
divider.style.height = "1px";
divider.style.backgroundColor = "#cdcdcd";
contentContainer.appendChild(divider);

const url = document.createElement("a");
url.style.color = "inherit";
url.style.fontSize = "12px";
url.style.display = "-webkit-box";
url.style.webkitBoxOrient = "vertical";
url.style.webkitLineClamp = "1";
url.style.overflow = "hidden";
contentContainer.appendChild(url);

//Loader Creation and Styles
const loader = document.createElement("span");
loader.style.width = "50px";
loader.style.height = "50px";
loader.style.position = "absolute";
loader.style.top = "50%";
loader.style.left = "50%";
loader.style.borderRadius = "100%";
loader.style.borderTop = "5px solid #797e7d";
loader.style.borderLeft = "5px solid #797e7d";
loader.style.borderBottom = "5px solid transparent";
loader.style.borderRight = "5px solid transparent";
loader.style.transform = "translate(-50%, -50%)";
loader.style.transformOrigin = "top left";
loader.style.backgroundColor = "transparent";
loader.animate([{ rotate: "0deg" }, { rotate: "360deg" }], { duration: 1000, iterations: Infinity });
popupContainer.appendChild(loader);
const showPopupLoader = () => {
  loader.style.visibility = "visible";
  imageContainer.style.visibility = "hidden";
  contentContainer.style.visibility = "hidden";
  popupContainer.style.backgroundColor = "transparent";
  popupContainer.style.boxShadow = "";
};
const hidePopupLoader = () => {
  loader.style.visibility = "hidden";
  imageContainer.style.visibility = "initial";
  contentContainer.style.visibility = "initial";
  popupContainer.style.backgroundColor = "#ffffff";
  popupContainer.style.boxShadow = "2px 2px 4px 0px rgba(0,0,0,0.3)";
};
hidePopupLoader();

//General Utilities
const findCLosestAnscestorLinkTag = (event) => {
  let x = event.target;
  while (!x.matches("a, body")) x = x.parentElement;
  if (x.matches("a")) {
    return x;
  }
  return null;
};
const repositionPopup = (element) => {
  const elementPosData = element.getBoundingClientRect();
  const containerPosData = popupContainer.getBoundingClientRect();
  const xPos = elementPosData.left + elementPosData.width / 2 - containerPosData.width / 2;
  let yPos = elementPosData.top;
  if (elementPosData.top > containerPosData.height + 10) yPos -= containerPosData.height + 5;
  else yPos += 10 + elementPosData.height;
  const offsetX = document.documentElement.clientWidth - containerPosData.width;
  popupContainer.style.top = `${Math.max(0, yPos)}px`;
  popupContainer.style.left = `${Math.max(0, Math.min(xPos, offsetX))}px`;
};
const populatePopupData = ({
  title: titleText,
  description: descriptionText,
  image: imageSrc,
  type: typeText,
  url: urlText,
}) => {
  loadNewImage(imageSrc);
  type.innerText = typeText ?? "Website";
  title.innerText = titleText;
  description.innerText = descriptionText ?? titleText;
  url.href = urlText;
  url.innerText = urlText;
};

document.body.addEventListener("mouseover", async (e) => {
  const foundTag = findCLosestAnscestorLinkTag(e);
  if (foundTag && foundTag !== previousTag) {
    if (abortController) abortController.abort("newrequest");
    previousTag = foundTag;
    abortController = new AbortController();
    try {
      isFetching = true;
      showPopupLoader();
      showPopupContainer();
      repositionPopup(foundTag);
      const ogData = await (
        await fetch(`${ogAPIURL}${foundTag.href}`, {
          signal: abortController.signal,
        })
      ).json();
      isFetching = false;
      ogData.title = ogData.title || foundTag.innerText;
      populatePopupData(ogData);
      hidePopupLoader();
    } catch (e) {
      isFetching = false;
      hidePopupContainer();
      console.log(e);
    }
  } else if (!foundTag) {
    if (abortController) abortController.abort("mouseout");
    previousTag = null;
    isFetching = false;
    hidePopupContainer();
  }
});
