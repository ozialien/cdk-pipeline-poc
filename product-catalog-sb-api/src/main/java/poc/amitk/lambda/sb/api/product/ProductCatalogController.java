package poc.amitk.lambda.sb.api.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author amitkapps
 */
@RestController()
@RequestMapping("/products")
public class ProductCatalogController {
    private Logger logger = LoggerFactory.getLogger(ProductCatalogController.class);

    @Autowired
    private ProductService productService;

    @GetMapping("")
    public List<Product> getProducts(){
        return productService.getAllProducts();
    }

    @GetMapping("/{productSku}")
    public Product getProductById(@PathVariable String productSku){
        return productService.getProductBySku(productSku);
    }

    @PostMapping("")
    public Product saveProduct(@RequestBody Product product){
        logger.info("request to add product to catalog: {}", product);
        return productService.addProductToCatalog(product);
    }

    @DeleteMapping("/{productSku}")
    public void removeProduct(@PathVariable String productSku){
        productService.removeProductFromCatalog(productSku);
    }

    @DeleteMapping("")
    public void removeAllProducts(){
        productService.removeAllProductsFromCatalog();
    }
}
