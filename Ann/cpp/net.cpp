#include <cstddef>
#include <cmath>
#include <vector>
#include <random>

namespace ann {

class MLP_float32_xavglot_sigmoid {
  public:
    float* weights;
    float* biases;
    size_t* weight_dims;
    size_t wd_size; // weight dims size
    size_t* bias_dims;
    
    size_t layer_num;
    size_t total_activations = 0;
    size_t total_weights = 0;
    
    MLP(std::vector<size_t> sizes) {
      layer_num = sizes.size();
      
      //input layer has no bias, or weights before it
      //sizes are layer_num, but the first index(0 for bias, 0 and 1 for weight) is always unset;
      wd_size = layer_num * 2;
      
      weight_dims = new size_t[wd_size](); //1 row, 1 col, (layer_num - 1) weight matrices
      bias_dims = new size_t[layer_num]();
      
      for (size_t l = 0; l < layer_num; l++) {
        total_activations += sizes[l];
      }
      
      for (size_t l = 1; l < layer_num; l++) {
        size_t& out_size = sizes[l];
        size_t& in_size = sizes[l-1];
        
        bias_dims[l] = out_size;
        weight_dims[l-1] = out_size;
        weight_dims[l] = in_size;
        total_weights += out_size * in_size;
      }
      
      weights = new float[total_weights]();
      biases = new float[total_activations]();
      
      //for random parameters
      std::random_device rd;
      std::mt19937 gen(rd());
      
      //Xavier/Glorot random weight init
      size_t weight_offset = 0;
      for (size_t wm = 2; wm < wd_size; wm += 2) {
        size_t rows = weight_dims[wm];
        size_t cols = weight_dims[wm + 1];

        float limit = sqrt(6.0 / (rows + cols));

        std::uniform_real_distribution<float> dist(-limit, limit);
        
        for (size_t r = 0; r < rows; r++) {
          for (size_t c = 0; c < cols; c++) {
            weights[weight_offset + r * cols + c] = dist(gen);
          }
        }

       weight_offset += rows * cols; //the matrix flat size
      }
      
    }
}

}//namespace ann {}