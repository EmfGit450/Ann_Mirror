#include <iostream>
#include <cmath>

bool isPerfectSqre(int x) {
  int root = sqrt(x);
  return root * root == x;
}

int main() {
  int size = 32;
  bool circular = true;
  
  int sqreSet[size];
  for (int i = 0; i < size; i++) {
    sqreSet[i] = i+1;
  }
}