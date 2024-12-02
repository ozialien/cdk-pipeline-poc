package poc.amitk.lambda.sb.api.product;

import org.springframework.data.repository.CrudRepository;

import com.amazonaws.xray.spring.aop.XRayEnabled;

import java.util.List;

/**
 * @author amitkapps
 */
@XRayEnabled
public interface ProductRepository extends CrudRepository<ProductEntity, String> {
    ProductEntity findByProductSku(String productSku);

    List<ProductEntity> findAll();

    ProductEntity save(ProductEntity productEntity);

    void delete(ProductEntity productEntity);

    void deleteAll();
}
