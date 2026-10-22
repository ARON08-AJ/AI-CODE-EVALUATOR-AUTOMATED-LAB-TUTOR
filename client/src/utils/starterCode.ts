export const starterCode: Record<string, string> = {
  C: `#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`,
  'C++': `#include <iostream>

using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`,
  Java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`,
  Python: `def main():
    # Write your code here
    pass

if __name__ == "__main__":
    main()`,
};

export const mapLanguageToMonaco = (lang: string) => {
  switch (lang) {
    case 'C': return 'c';
    case 'C++': return 'cpp';
    case 'Java': return 'java';
    case 'Python': return 'python';
    default: return 'plaintext';
  }
};
