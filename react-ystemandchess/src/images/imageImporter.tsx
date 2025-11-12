/**
 * Image Importer and Asset Management
 * 
 * This module centralizes all image imports and provides a typed interface
 * for accessing images throughout the application. It organizes images by
 * category and ensures type safety when referencing image assets.
 * 
 * Benefits:
 * - Centralized image management
 * - Type-safe image references
 * - Easy to maintain and update image paths
 * - Organized by page/component usage
 * - Prevents broken image references
 */

// General branding and marketing images
import LogoLineBr from "./LogoLineBreak.png";          // Logo with line break styling
import TreesGroup from "./Trees-Group.png";            // Decorative trees illustration
import Heart from "./heart-regular.svg";               // Heart icon for favorites/likes
import Gem from "./gem-regular.svg";                   // Gem icon for achievements/rewards
import LargeInfo from "./large_info.png";              // Large informational graphic
import ChessGroup from "./chessGroup.png";             // Chess pieces group illustration

// Book and publication images for home page
import Book1 from "./book-howtostart.png";             // "How to Start" book cover
import Book2 from "./book-thezerodollar.png";          // "Zero Dollar Workforce" book cover
import BuyNow from "./buy-now.png";                    // Buy now button/graphic

// Student Inventory Page - User interface icons and graphics
import userPortraitCamera from "./camera.svg";         // Camera icon for profile pictures
import lineGraphPlaceholder from "./line-graph-placeholder.png"; // Placeholder for analytics charts

// Student Inventory Page - Activity and navigation icons
// These icons represent different sections/activities in the student dashboard
import activityIcon from "./StudentInventoryIcons/activity-icon.svg";           // General activities icon
import mentorIcon from "./StudentInventoryIcons/mentor-icon.svg";               // Mentoring section icon
import learningIcon from "./StudentInventoryIcons/learning-icon.svg";           // Learning materials icon
import chessLessonsIcon from "./StudentInventoryIcons/chess-lessons-icon.svg";  // Chess lessons icon
import gamesIcon from "./StudentInventoryIcons/games-icon.svg";                 // Games section icon
import puzzlesIcon from "./StudentInventoryIcons/puzzles-icon.svg";             // Puzzles section icon
import playComputerIcon from "./StudentInventoryIcons/play-computer-icon.svg";  // Play against computer icon
import recordingsIcon from "./StudentInventoryIcons/recordings-icon.svg";       // Session recordings icon
import backpackIcon from "./StudentInventoryIcons/backpack-icon.svg";           // Student inventory/backpack icon

// Educational content images for specific pages
import mathComputerImg from "./mathArticle/computer.png";  // Computer illustration for math articles
import mathChampImg from "./mathArticle/Junechamp 2.png";  // Championship/achievement image for math content

/**
 * TypeScript type definition for all available image keys
 * 
 * This union type ensures type safety when accessing images from the
 * images object. It includes all available image identifiers organized
 * by their usage category.
 * 
 * Categories:
 * - Branding: LogoLineBr, TreesGroup, Heart, Gem, LargeInfo, ChessGroup
 * - Publications: Book1, Book2, BuyNow
 * - Educational: mathComputerImg, mathChampImg
 * - User Interface: userPortraitCamera, lineGraphPlaceholder
 * - Student Dashboard: activityIcon, mentorIcon, learningIcon, etc.
 */
type ImageKey = 
  // Branding and general graphics
  | "LogoLineBr" | "TreesGroup" | "Heart" | "Gem" | "LargeInfo" | "ChessGroup"
  // Book and publication images
  | "Book1" | "Book2" | "BuyNow"
  // Educational content images
  | "mathComputerImg" | "mathChampImg"
  // User interface elements
  | "userPortraitCamera" | "lineGraphPlaceholder"
  // Student dashboard activity icons
  | "activityIcon" | "mentorIcon" | "learningIcon" | "chessLessonsIcon"
  | "gamesIcon" | "puzzlesIcon" | "playComputerIcon" | "recordingsIcon" | "backpackIcon";

/**
 * Centralized images object with type-safe key-value mapping
 * 
 * This object maps image keys to their imported image paths, providing
 * a single source of truth for all image assets. The mapping is strongly
 * typed to prevent runtime errors from incorrect image references.
 * 
 * Usage:
 * ```typescript
 * import images from './images/imageImporter';
 * 
 * // Type-safe image access
 * const logoSrc = images.LogoLineBr;
 * const heartIcon = images.Heart;
 * 
 * // Use in JSX
 * <img src={images.ChessGroup} alt="Chess pieces" />
 * ```
 */
const images: { [key in ImageKey]: string } = {
  // Branding and marketing images
  LogoLineBr,                // Company logo with line break
  TreesGroup,                // Decorative illustration
  Heart,                     // Heart icon for UI elements
  Gem,                       // Achievement/reward icon
  LargeInfo,                 // Large informational graphic
  ChessGroup,                // Chess-themed illustration
  
  // Publication and book images
  Book1,                     // First book cover image
  Book2,                     // Second book cover image
  BuyNow,                    // Purchase button/call-to-action
  
  // Educational content images
  mathComputerImg,           // Computer illustration for math content
  mathChampImg,              // Achievement image for math articles
  
  // User interface elements
  userPortraitCamera,        // Camera icon for profile management
  lineGraphPlaceholder,      // Chart placeholder for analytics
  
  // Student dashboard activity icons
  activityIcon,              // General activities navigation
  mentorIcon,                // Mentoring section access
  learningIcon,              // Learning materials access
  chessLessonsIcon,          // Chess-specific lessons
  gamesIcon,                 // Games and gameplay section
  puzzlesIcon,               // Puzzle challenges section
  playComputerIcon,          // Computer opponent games
  recordingsIcon,            // Session recordings and history
  backpackIcon,              // Student inventory and progress
};

export default images;
