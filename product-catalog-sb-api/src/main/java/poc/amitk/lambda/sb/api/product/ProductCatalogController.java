package poc.amitk.lambda.sb.api.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyAuthority('SCOPE_aws.cognito.signin.user.admin', 'SCOPE_catalog/read', 'SCOPE_catalog/update'")
    public List<Product> getProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{productSku}")
    @PreAuthorize("hasAnyAuthority('SCOPE_catalog/read', 'SCOPE_catalog/update'")
    public Product getProductById(@PathVariable String productSku) {
        return productService.getProductBySku(productSku);
    }

    @PostMapping("")
    @PreAuthorize("hasAnyAuthority('SCOPE_aws.cognito.signin.user.admin', 'SCOPE_catalog/update'")
    public Product saveProduct(@RequestBody Product product) {
        logger.info("request to add product to catalog: {}", product);
        return productService.addProductToCatalog(product);
    }

    @DeleteMapping("/{productSku}")
    @PreAuthorize("hasAnyAuthority('SCOPE_aws.cognito.signin.user.admin' 'SCOPE_catalog/update'")
    public void removeProduct(@PathVariable String productSku) {
        productService.removeProductFromCatalog(productSku);
    }

    @DeleteMapping("")
    @PreAuthorize("hasAnyAuthority('SCOPE_aws.cognito.signin.user.admin', 'SCOPE_catalog/update'")
    public void removeAllProducts() {
        productService.removeAllProductsFromCatalog();
    }
}
