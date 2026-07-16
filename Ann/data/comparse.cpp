#include <emscripten.h>
#include <iostream>
#include <fstream>
#include <cstdint>
using namespace std;

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  void compress(float* buffer, int neuron_count) {
    
  }
}

int main() {
  uint32_t neuron_count = 3992;
  
  ofstream file("network.vann", ios::binary);
  
  file.write("VANN", 4);
  file.write(reinterpret_cast<const char*>(&neuron_count), sizeof(neuron_count));
  
  file.put(0x1F); 
  
  file.close();
}