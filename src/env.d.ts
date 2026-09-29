// The page route records the page file it is rendering here, so a section
// component that finds a problem can name the file (contracts/build-errors.md).
declare namespace App {
  interface Locals {
    pageFile?: string;
  }
}
